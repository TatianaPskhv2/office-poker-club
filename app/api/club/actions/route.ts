import { NextResponse } from "next/server";
import { createSeedState } from "@/lib/data/seed";
import { applyClubAction } from "@/lib/server/club-actions";
import { saveClub, updateClub, withActor } from "@/lib/server/club-file";
import { getSessionUserId } from "@/lib/server/session";

export async function POST(request: Request) {
  try {
    const userId = await getSessionUserId();
    if (!userId) return NextResponse.json({ error: "Нужно войти" }, { status: 401 });
    const body = (await request.json()) as {
      action: string;
      payload?: Record<string, unknown>;
    };
    if (body.action === "reset") {
      const current = await (await import("@/lib/server/club-file")).loadClub();
      const actor = current.users.find((item) => item.id === userId);
      if (!actor || actor.role !== "admin") {
        return NextResponse.json({ error: "Недостаточно прав" }, { status: 403 });
      }
      const seed = createSeedState();
      seed.users = current.users;
      const saved = await saveClub(seed);
      return NextResponse.json({ state: withActor(saved, actor) });
    }
    const state = await updateClub((current) => {
      const actor = current.users.find((item) => item.id === userId);
      if (!actor) throw new Error("Нужно войти");
      return applyClubAction(current, actor, body.action, body.payload ?? {});
    });
    const actor = state.users.find((item) => item.id === userId);
    if (!actor) return NextResponse.json({ error: "Нужно войти" }, { status: 401 });
    return NextResponse.json({ state: withActor(state, actor) });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Ошибка" },
      { status: 400 }
    );
  }
}
