import { NextResponse } from "next/server";
import { loadClub, withActor } from "@/lib/server/club-file";
import { getSessionUserId } from "@/lib/server/session";

export async function GET() {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ user: null }, { status: 401 });
  const state = await loadClub();
  const user = state.users.find((item) => item.id === userId);
  if (!user) return NextResponse.json({ user: null }, { status: 401 });
  return NextResponse.json({ user, state: withActor(state, user) });
}
