import { NextResponse } from "next/server";
import { startLiveSession } from "@/lib/live/store";
import type { CreateLiveInput } from "@/types";

export async function POST(request: Request) {
  try {
    const input = (await request.json()) as CreateLiveInput;
    if (!input?.id || !Array.isArray(input.players)) {
      return NextResponse.json({ error: "Нужны игроки и id стола" }, { status: 400 });
    }
    const session = await startLiveSession(input);
    return NextResponse.json({ session });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Не удалось открыть стол";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
