import { NextResponse } from "next/server";
import { createSeedState } from "@/lib/data/seed";
import { loadClub, saveClub, withActor } from "@/lib/server/club-file";
import { getSessionUserId } from "@/lib/server/session";
import type { ClubState } from "@/types";

export async function GET() {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ error: "Нужно войти" }, { status: 401 });
  const state = await loadClub();
  const user = state.users.find((item) => item.id === userId);
  if (!user) return NextResponse.json({ error: "Нужно войти" }, { status: 401 });
  return NextResponse.json({ state: withActor(state, user) });
}

export async function PUT(request: Request) {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ error: "Нужно войти" }, { status: 401 });
  const current = await loadClub();
  const actor = current.users.find((item) => item.id === userId);
  if (!actor || actor.role !== "admin") {
    return NextResponse.json({ error: "Недостаточно прав" }, { status: 403 });
  }
  const body = (await request.json()) as { state?: ClubState };
  if (!body.state) return NextResponse.json({ error: "Нет данных" }, { status: 400 });
  const incoming = body.state;
  const hasMore =
    incoming.results.length > current.results.length ||
    incoming.games.filter((game) => game.status === "completed").length >
      current.games.filter((game) => game.status === "completed").length;
  if (!hasMore && current.games.length > createSeedState().games.length) {
    return NextResponse.json({ state: withActor(current, actor) });
  }
  const saved = await saveClub({ ...incoming, currentUserId: actor.id, users: current.users });
  return NextResponse.json({ state: withActor(saved, actor) });
}
